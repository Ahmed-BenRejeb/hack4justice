terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Local state only: this stack is a single-day throwaway demo, not a
  # long-lived environment. `terraform destroy` plus a manual console check
  # is the entire teardown story (see docs/deploy.md).
}

provider "aws" {
  region = var.aws_region
}
