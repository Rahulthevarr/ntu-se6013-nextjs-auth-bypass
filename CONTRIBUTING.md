# Contributing

The maintainer is @sodiptabadiabanurea. Members contribute through forks and pull requests, not direct pushes to this repository.

## Before opening a PR

This repository is public. A PR's description, including your full name and matriculation number, is public too. Others may copy or index it even if you later edit it. Provide only your own details and tick the disclosure acknowledgement yourself. If you do not agree, contact the maintainer before submitting; the automatic gate has no member bypass.

Do not upload passwords, tokens, real environment files, student records, raw course materials or private project code without explicit clearance for publication.

## Fork and submit

1. Open https://github.com/sodiptabadiabanurea/ntu-se6013-nextjs-auth-bypass and click **Fork** to create your own copy.
2. Clone your fork. Replace `YOUR_GITHUB_USERNAME` below with your account name.

```sh
git clone https://github.com/YOUR_GITHUB_USERNAME/ntu-se6013-nextjs-auth-bypass.git
cd ntu-se6013-nextjs-auth-bypass
git remote add upstream https://github.com/sodiptabadiabanurea/ntu-se6013-nextjs-auth-bypass.git
git switch -c m2/your-topic
```

Use your module and topic in the branch name, such as `m1/application`, `m2/root-cause`, `m3/reproduction`, `m4/remediation` or `m5/evaluation`. These are branch examples, not personal assignments.

3. Make your changes, run the relevant checks and stage only the files you intend to submit.

```sh
git add path/to/your/file
git commit -m "docs: explain the reviewed change"
git push -u origin HEAD
```

4. In your fork, select **Contribute**, then **Open pull request**. Set the base repository to `sodiptabadiabanurea/ntu-se6013-nextjs-auth-bypass` and base branch to `main`.
5. Fill in the template. Keep the exact `Full name:` and `Matriculation number:` labels on separate lines, outside code blocks and comments. Tick the public-disclosure acknowledgement. Describe your change and the checks you actually ran.
6. Wait for the identity check and maintainer review. If either identity field is absent, incomplete or a placeholder, the check fails. Edit the PR description to correct it; the check runs again. A green identity check is not code approval.
7. Respond to review comments and push revisions to the same branch in your fork. New code commits require fresh approval. The maintainer verifies identity, reviews and merges accepted work.

Do not change the identity gate, CODEOWNERS or workflow to bypass these requirements. Such a change is itself subject to maintainer review.

## Identity check limits

The automatic check requires a non-placeholder full name and a 5-30 character matriculation identifier using letters, digits or hyphens, with at least one digit. This is a basic input check, not an official NTU format or identity lookup. If your genuine identifier does not fit, ask the maintainer to review the policy rather than entering a fake one.

An unfilled template is rejected. Consent cannot be supplied inside an HTML comment or fenced example. The gate reports field errors without copying submitted identities into workflow logs. Your PR description remains public.

## Keeping your fork current

```sh
git fetch upstream
git switch main
git merge --ff-only upstream/main
git push origin main
```

Create a new topic branch for the next contribution. Never force-push to the shared `main` branch.
