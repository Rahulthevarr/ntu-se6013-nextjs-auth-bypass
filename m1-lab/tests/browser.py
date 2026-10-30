"""Browser acceptance for the actual running M1 lab, not the M3/M4 experiment."""
import argparse
import asyncio
import importlib.metadata
import json
from pathlib import Path
from playwright.async_api import async_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
VALUES = dict(line.split('=', 1) for line in (ROOT / '.env').read_text().splitlines() if line and not line.startswith('#'))
ORIGIN = VALUES['LAB_PUBLIC_ORIGIN']
OUT = ROOT / 'artifacts'
OUT.mkdir(exist_ok=True)

async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--unavailable', action='store_true')
    args = parser.parse_args()
    receipt = {'playwright': importlib.metadata.version('playwright'), 'flows': [], 'viewports': [], 'errors': []}
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        receipt['chromium'] = browser.version
        context = await browser.new_context(viewport={'width': 1440, 'height': 1000}, http_credentials={'username': VALUES['CONTROL_USER'], 'password': VALUES['CONTROL_PASSWORD']})
        page = await context.new_page()
        page.on('pageerror', lambda error: receipt['errors'].append(str(error)))
        console_errors = []
        page.on('console', lambda message: console_errors.append(message.text) if message.type == 'error' else None)
        await page.goto(ORIGIN, wait_until='networkidle')
        status = page.locator('#health-status')
        if args.unavailable:
            await expect(status).to_contain_text('could not be verified')
            await expect(page.locator('#version')).to_have_text('Not verified')
            await expect(page.locator('#application-frame')).to_be_hidden()
            await expect(page.locator('#app-state')).not_to_contain_text('Waiting')
            await expect(page.locator('#refresh')).to_be_enabled()
            receipt['flows'].append('real target stopped: unavailable, unknown version, application hidden, retry enabled')
            await page.screenshot(path=str(OUT / 'target-unavailable.png'), full_page=True)
            (OUT / 'browser-unavailable.json').write_text(json.dumps(receipt, indent=2))
            await browser.close()
            print(json.dumps(receipt, indent=2))
            return
        await expect(status).to_contain_text('Ready.')
        await expect(page.locator('#version')).to_have_text('Next.js 14.2.24')
        await expect(page.get_by_text('Not run', exact=True)).to_be_visible()
        receipt['flows'].append('operator-gated panel loads real version and health; experiments remain Not run')
        await page.get_by_role('link', name='Skip to lab workspace').focus()
        await page.keyboard.press('Enter')
        assert await page.evaluate('location.hash') == '#workspace'
        for target in ['patched', 'header-filter', 'server-auth']:
            await page.locator('#target').select_option(target)
            await expect(status).to_contain_text('Not installed.')
            await expect(page.locator('#application-frame')).to_be_hidden()
            await expect(page.locator('#version')).to_have_text('Not verified')
        await page.locator('#target').select_option('vulnerable')
        await expect(status).to_contain_text('Ready.')
        receipt['flows'].append('all three M4 selectors show Not installed without inventing versions or results')
        frame = page.frame_locator('#application-frame')
        await expect(frame.get_by_role('heading', name='A small application with a protected dashboard.')).to_be_visible()
        await frame.get_by_role('link', name='Open protected dashboard').click()
        await expect(frame.get_by_role('heading', name='Log in to the example app')).to_be_visible()
        await frame.get_by_label('Target username').fill('wrong')
        await frame.get_by_label('Target password').fill('wrong')
        await frame.get_by_role('button', name='Log in to target', exact=True).click()
        await expect(frame.get_by_role('alert').filter(has_text='Login failed')).to_contain_text('Login failed')
        await frame.get_by_label('Target username').fill(VALUES['LAB_USER'])
        await frame.get_by_label('Target password').fill(VALUES['LAB_PASSWORD'])
        await frame.get_by_role('button', name='Log in to target', exact=True).click()
        await expect(frame.get_by_role('heading', name='Fictional records', exact=True)).to_be_visible()
        await expect(frame.get_by_text('M1-FICTIONAL-RECORDS-ONLY', exact=True)).to_be_visible()
        cookies = await context.cookies()
        target_cookies = [cookie for cookie in cookies if cookie['name'] == 'lab_vulnerable_session']
        assert len(target_cookies) == 1
        assert target_cookies[0]['httpOnly'] and target_cookies[0]['sameSite'] == 'Strict'
        assert target_cookies[0]['path'] == '/lab/vulnerable'
        receipt['cookie'] = {key: target_cookies[0][key] for key in ['name', 'path', 'httpOnly', 'sameSite', 'secure']}
        await frame.get_by_role('link', name='Open records JSON').click()
        await expect(frame.locator('body')).to_contain_text('M1-FICTIONAL-RECORDS-ONLY')
        live_frame = next(value for value in page.frames if '/lab/vulnerable' in value.url)
        await live_frame.goto(ORIGIN + '/lab/vulnerable/dashboard', wait_until='networkidle')
        await frame.get_by_role('link', name='Public page', exact=True).click()
        await frame.get_by_role('link', name='Open protected dashboard').click()
        await expect(frame.get_by_role('heading', name='Fictional records', exact=True)).to_be_visible()
        await frame.get_by_role('button', name='Log out of target').click()
        await expect(frame.get_by_role('heading', name='Log in to the example app')).to_be_visible()
        await frame.get_by_role('link', name='Back to public page').click()
        await frame.get_by_role('link', name='Open protected dashboard').click()
        await expect(frame.get_by_role('heading', name='Log in to the example app')).to_be_visible()
        receipt['flows'].append('anonymous dashboard redirects; wrong login fails; valid login exposes fictional marker and JSON; logout restores normal denial')
        async with page.expect_popup() as popup_info:
            await page.locator('#open-app').click()
        popup = await popup_info.value
        await popup.wait_for_load_state('networkidle')
        await expect(popup.get_by_role('heading', name='A small application with a protected dashboard.')).to_be_visible()
        await popup.close()
        receipt['flows'].append('Open app in new tab opens the actual target public page')
        held = asyncio.Event()
        release = asyncio.Event()
        async def delayed_health(route):
            response = await route.fetch()
            held.set()
            await release.wait()
            await route.fulfill(response=response)
        await page.route('**/api/targets', delayed_health)
        await page.locator('#refresh').click()
        await held.wait()
        await expect(page.locator('#refresh')).to_be_disabled()
        await expect(status).to_have_text('Checking target health...')
        release.set()
        await expect(page.locator('#refresh')).to_be_enabled()
        await expect(status).to_contain_text('Ready.')
        await page.unroute('**/api/targets', delayed_health)
        receipt['flows'].append('real health response held in transit: pending text and duplicate-submission protection, then real recovery')
        async def network_failure(route):
            await route.abort('failed')
        await page.route('**/api/targets', network_failure)
        await page.locator('#refresh').click()
        await expect(status).to_contain_text('unavailable')
        await expect(page.locator('#application-frame')).to_be_hidden()
        await expect(page.locator('#version')).to_have_text('Not verified')
        await page.unroute('**/api/targets', network_failure)
        await page.locator('#target').focus()
        await page.keyboard.press('Tab')
        await expect(page.locator('#refresh')).to_be_focused()
        focus = await page.locator('#refresh').evaluate('(el) => ({outline:getComputedStyle(el).outlineStyle,width:getComputedStyle(el).outlineWidth})')
        assert focus['outline'] != 'none'
        await page.keyboard.press('Enter')
        await expect(status).to_contain_text('Ready.')
        receipt['flows'].append('deliberate client network failure gives truthful unavailable state; keyboard retry restores actual health')
        await expect(frame.get_by_role('heading', name='A small application with a protected dashboard.')).to_be_visible()
        for width, height in [(320, 800), (375, 812), (768, 1024), (1024, 768), (1440, 1000)]:
            await page.set_viewport_size({'width': width, 'height': height})
            await expect(page.locator('#application-frame')).to_be_visible()
            geometry = await page.evaluate('''() => ({width:innerWidth, document:document.documentElement.scrollWidth, controls:[...document.querySelectorAll('button,select,a')].filter(e=>e.getClientRects().length && !e.classList.contains('skip')).map(e=>({text:e.textContent.trim(),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}))})''')
            assert geometry['document'] <= width, geometry
            assert all(control['height'] >= 44 for control in geometry['controls']), geometry
            target = next(value for value in page.frames if '/lab/vulnerable' in value.url)
            target_geometry = await target.evaluate('''() => ({width:innerWidth, document:document.documentElement.scrollWidth, height:innerHeight, documentHeight:document.documentElement.scrollHeight})''')
            for attempt in range(20):
                if target_geometry['documentHeight'] <= target_geometry['height']:
                    break
                await asyncio.sleep(0.05)
                target_geometry = await target.evaluate('''() => ({width:innerWidth, document:document.documentElement.scrollWidth, height:innerHeight, documentHeight:document.documentElement.scrollHeight})''')
            assert target_geometry['document'] <= target_geometry['width'], target_geometry
            assert target_geometry['documentHeight'] <= target_geometry['height'], target_geometry
            receipt['viewports'].append({'width': width, 'height': height, 'panel': geometry, 'target': target_geometry})
            if width in [375, 1440]:
                await page.screenshot(path=str(OUT / f'workbench-{width}.png'), full_page=True)
        await page.set_viewport_size({'width': 375, 'height': 812})
        await frame.get_by_role('link', name='Log in to the target', exact=True).click()
        await expect(frame.get_by_label('Target username')).to_be_visible()
        await frame.get_by_role('button', name='Log in to target', exact=True).click()
        assert await frame.locator('form').evaluate('(el)=>!el.checkValidity()')
        await frame.get_by_label('Target username').fill(VALUES['LAB_USER'])
        await frame.get_by_label('Target password').fill(VALUES['LAB_PASSWORD'])
        await frame.get_by_label('Target password').focus()
        await page.keyboard.press('Tab')
        await expect(frame.get_by_role('button', name='Log in to target', exact=True)).to_be_focused()
        await page.keyboard.press('Enter')
        await expect(frame.get_by_role('heading', name='Fictional records', exact=True)).to_be_visible()
        target = next(value for value in page.frames if '/lab/vulnerable' in value.url)
        controls = await target.evaluate('''() => [...document.querySelectorAll('a,button,input')].map(e=>({tag:e.tagName,height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width}))''')
        assert all(control['height'] >= 44 for control in controls), controls
        assert await target.evaluate('document.documentElement.scrollWidth <= innerWidth')
        await page.screenshot(path=str(OUT / 'dashboard-375.png'), full_page=True)
        await frame.get_by_role('button', name='Log out of target').click()
        await expect(frame.get_by_label('Target username')).to_be_visible()
        receipt['flows'].append('375px target: required-field validation, keyboard login, fictional dashboard, 44px targets and logout')
        before = await page.locator('body').evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)')
        await page.evaluate("document.documentElement.style.fontSize='200%'")
        after = await page.locator('body').evaluate('(e)=>parseFloat(getComputedStyle(e).fontSize)')
        assert after == before * 2
        assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        await page.emulate_media(reduced_motion='reduce')
        await page.locator('#refresh').click()
        await expect(status).to_contain_text('Ready.')
        receipt['flows'].append(f'375px text resize {before}px to {after}px reflows; reduced-motion health check works')
        receipt['console_errors'] = [message for message in console_errors if not any(expected in message for expected in ['net::ERR_FAILED', '401 (Unauthorized)'])]
        assert not receipt['errors'], receipt['errors']
        assert not receipt['console_errors'], receipt['console_errors']
        (OUT / 'browser.json').write_text(json.dumps(receipt, indent=2))
        await browser.close()
        print(json.dumps(receipt, indent=2))

asyncio.run(main())
