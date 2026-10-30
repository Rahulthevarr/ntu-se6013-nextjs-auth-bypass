import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from pr_identity import validate


class IdentityTests(unittest.TestCase):
    def test_missing_fields_are_rejected(self):
        errors = validate("## Changes\nDocumentation update.\n")
        self.assertIn("Full name is required.", errors)
        self.assertIn("Matriculation number is required.", errors)

    # Synthetic identifiers below are fixtures, not student identities.
    def body(self, name="Synthetic Gate Contributor", matric="SYNTHETIC0001"):
        return f"Full name: {name}\nMatriculation number: {matric}\n"

    def test_only_completed_identity_fields_are_required(self):
        self.assertEqual(validate(self.body()), [])

    def test_changed_identifiers_are_accepted(self):
        self.assertEqual(validate(self.body("Another Synthetic Contributor", "FIXTURE-9284")), [])

    def test_unicode_name_is_accepted(self):
        self.assertEqual(validate(self.body("Synthétique O'Fixture")), [])

    def test_missing_name_is_rejected(self):
        self.assertIn("Full name is required.", validate("Matriculation number: SYNTHETIC0001\n"))

    def test_missing_matric_is_rejected(self):
        self.assertIn("Matriculation number is required.", validate("Full name: Synthetic Gate Contributor\n"))

    def test_placeholder_name_is_rejected(self):
        self.assertTrue(validate(self.body(name="YOUR FULL NAME")))

    def test_placeholder_matric_is_rejected(self):
        self.assertTrue(validate(self.body(matric="YOUR_MATRICULATION_NUMBER")))

    def test_matric_without_digits_is_rejected(self):
        self.assertTrue(validate(self.body(matric="notastudentnumber")))

    def test_duplicate_field_is_rejected(self):
        self.assertTrue(validate(self.body() + "Full name: Duplicate Fixture\n"))

    def test_html_comment_cannot_supply_identity(self):
        self.assertTrue(validate("<!--\n" + self.body() + "-->"))

    def test_code_fence_cannot_supply_identity(self):
        self.assertTrue(validate("```text\n" + self.body() + "```\n"))

    def test_null_body_is_rejected(self):
        self.assertTrue(validate(None))

    def test_invalid_json_body_type_is_rejected(self):
        self.assertTrue(validate({"unexpected": "object"}))


if __name__ == "__main__":
    unittest.main()
