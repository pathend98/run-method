resource "aws_instance" "run_method" {
  ami           = "ami-0224ce6f9504665ee"
  instance_type = "t3.small"

  subnet_id = data.aws_subnet.run_method.id

  vpc_security_group_ids = [
    aws_security_group.run_method_web.id,
    aws_security_group.ec2_rds_1.id
  ]

  iam_instance_profile = aws_iam_instance_profile.run_method_ec2.name

  tags = {
    Name        = "run-method-prod"
    application = "run-method"
    environment = "production"
  }

  lifecycle {
    prevent_destroy = true
  }
}