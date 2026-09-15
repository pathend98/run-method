resource "aws_ecr_repository" "run_method" {

  image_tag_mutability = "IMMUTABLE"
  name                 = "run-method"

  encryption_configuration {
    encryption_type = "AES256"
  }
  image_scanning_configuration {
    scan_on_push = false
  }
}
