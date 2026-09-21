resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]
}

data "aws_iam_policy_document" "github_assume_role" {
  statement {
    effect = "Allow"

    actions = [
      "sts:AssumeRoleWithWebIdentity"
    ]

    principals {
      type = "Federated"

      identifiers = [
        aws_iam_openid_connect_provider.github.arn
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"

      values = [
        "sts.amazonaws.com"
      ]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"

      values = [
        "repo:pathend98*"
      ]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name = "run-method-github-ecr-publisher"

  assume_role_policy = data.aws_iam_policy_document.github_assume_role.json
}

data "aws_iam_policy_document" "github_ecr_publish" {
  statement {
    sid    = "EcrAuthentication"
    effect = "Allow"

    actions = [
      "ecr:GetAuthorizationToken"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "PushRunMethod"
    effect = "Allow"

    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:CompleteLayerUpload",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart"
    ]

    resources = [aws_ecr_repository.run_method.arn]
  }
}

resource "aws_iam_role_policy" "github_ecr_publish" {
  name   = "Policy"
  role   = aws_iam_role.github_deploy.name
  policy = data.aws_iam_policy_document.github_ecr_publish.json
}

data "aws_iam_policy_document" "github_deploy" {
  statement {
    sid    = "RunDeploymentDocument"
    effect = "Allow"

    actions = [
      "ssm:SendCommand"
    ]

    resources = ["arn:aws:ssm:eu-west-2::document/AWS-RunShellScript"]
  }

  statement {
    sid    = "DeployToRunMethodProduction"
    effect = "Allow"

    actions = [
      "ssm:SendCommand"
    ]

    resources = [
      "arn:aws:ec2:eu-west-2:824892928715:instance/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "ssm:resourceTag/Application"

      values = [
        "run-method"
      ]
    }

    condition {
      test     = "StringEquals"
      variable = "ssm:resourceTag/Environment"

      values = [
        "production"
      ]
    }
  }

  statement {
    sid    = "ReadDeploymentResult"
    effect = "Allow"

    actions = [
      "ssm:GetCommandInvocation",
      "ssm:ListCommandInvocations"
    ]

    resources = ["*"]
  }

  statement {
    sid    = "FindProductionInstance"
    effect = "Allow"

    actions = [
      "ec2:DescribeInstances"
    ]

    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "run-method-github-deploy"
  role   = aws_iam_role.github_deploy.name
  policy = data.aws_iam_policy_document.github_deploy.json
}
