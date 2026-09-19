data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    effect = "Allow"

    actions = [
      "sts:AssumeRole"
    ]

    principals {
      type = "Service"

      identifiers = [
        "ec2.amazonaws.com"
      ]
    }
  }
}

resource "aws_iam_role" "run_method_ec2" {
  name               = "run-method-ec2-role"
  description        = "Role for EC2 instances for runmethodtraining.com"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json
}

resource "aws_iam_instance_profile" "run_method_ec2" {
  name = "run-method-ec2-role"
  role = aws_iam_role.run_method_ec2.name
}