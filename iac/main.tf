terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }

  # Remote state — create this S3 bucket + DynamoDB lock table once, out of band,
  # before running `terraform init`.
  backend "s3" {
    bucket         = "hospital-pms-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "hospital-pms-tf-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "hospital-pms"
      Environment = var.environment
      ManagedBy   = "terraform"
      Compliance  = "hipaa"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}
