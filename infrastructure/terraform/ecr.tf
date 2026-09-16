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

resource "aws_ecr_lifecycle_policy" "run_method" {
  repository = aws_ecr_repository.run_method.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Ensure only the last 2 semantic-versioned images are kept"

        selection = {
          tagStatus      = "tagged"
          tagPatternList = ["v*.*.*"]
          countType      = "imageCountMoreThan"
          countNumber    = 2
        }

        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Ensure only one non-semantic-versioned image is kept"

        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 1
        }

        action = {
          type = "expire"
        }
      }
    ]
  })
}
