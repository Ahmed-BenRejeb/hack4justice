"""Create an account from the command line (A3).

MSME owners sign up in the web app. Officer, admin and accountant accounts are
created here, because a public form must not grant a role that acts for the
administration or for several organisations. An accountant is granted each
organisation by its matricule fiscal:

    uv run python -m app.auth.create_user agent@example.tn officer
    uv run python -m app.auth.create_user cabinet@example.tn accountant \\
        --organisation 1122334M --organisation 2233445N

The password is prompted for, or read from the first line of piped input,
never passed as an argument (root CLAUDE.md: no secret in a CLI flag).
"""

import argparse
import getpass
import sys

from app.auth.service import ROLES, AccountError, create_user
from app.db.models import Organisation
from app.db.session import SessionLocal


def main(argv: list[str] | None = None) -> int:
    """Create the account named on the command line; returns the process exit code."""
    parser = argparse.ArgumentParser(description="Create a Chahed account.")
    parser.add_argument("email")
    parser.add_argument("role", choices=ROLES)
    parser.add_argument(
        "--organisation",
        action="append",
        default=[],
        metavar="TAX_ID",
        help="matricule fiscal of an organisation this user files for (repeatable)",
    )
    args = parser.parse_args(argv)
    password = (
        getpass.getpass("Password: ")
        if sys.stdin.isatty()
        else sys.stdin.readline().rstrip("\n")
    )

    with SessionLocal() as db:
        organisations = []
        for tax_id in args.organisation:
            organisation = db.query(Organisation).filter_by(tax_id=tax_id).one_or_none()
            if organisation is None:
                print(f"error: no organisation with tax id {tax_id}", file=sys.stderr)
                return 1
            organisations.append(organisation)
        try:
            user = create_user(
                db,
                email=args.email,
                password=password,
                role=args.role,
                organisations=organisations,
            )
        except AccountError as error:
            print(f"error: {error}", file=sys.stderr)
            return 1
        db.commit()
        print(f"created {user.role} account {user.email}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
