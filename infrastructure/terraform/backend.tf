terraform {
  backend "s3" {
    bucket       = "run-method-terraform-state-824892928715-eu-west-2-an"
    key          = "run-method/prod/terraform.tfstate"
    region       = "eu-west-2"
    encrypt      = true
    use_lockfile = true
  }
}
