resource "aws_eip" "run_method" {
  domain = "vpc"

  tags = {
    Name        = "run-method-prod"
    application = "run-method"
    environment = "production"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_eip_association" "run_method" {
  allocation_id = aws_eip.run_method.id
  instance_id   = aws_instance.run_method.id
}
