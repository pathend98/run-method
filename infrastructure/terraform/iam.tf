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

data "aws_iam_policy" "ssm_managed_instance_core" {
  arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy" "cloudwatch_agent_server" {
  arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
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

resource "aws_iam_role_policy_attachment" "ssm_managed_instance_core" {
  role       = aws_iam_role.run_method_ec2.name
  policy_arn = data.aws_iam_policy.ssm_managed_instance_core.arn
}

resource "aws_iam_role_policy_attachment" "cloudwatch_agent_server" {
  role       = aws_iam_role.run_method_ec2.name
  policy_arn = data.aws_iam_policy.cloudwatch_agent_server.arn
}

resource "aws_iam_role_policy" "ecr_pull" {
  name = "run-method-ecr-pull"
  role = aws_iam_role.run_method_ec2.name

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "PullRunMethod",
        "Effect" : "Allow",
        "Action" : [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ],
        "Resource" : "arn:aws:ecr:eu-west-2:824892928715:repository/run-method"
      },
      {
        "Sid" : "EcrAuthentication",
        "Effect" : "Allow",
        "Action" : "ecr:GetAuthorizationToken",
        "Resource" : "*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "parameter_store" {
  name = "run-method-parameter-store"
  role = aws_iam_role.run_method_ec2.name

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ],
        "Resource" : "arn:aws:ssm:eu-west-2:824892928715:parameter/run-method/prod/*"
      }
    ]
  })
}
