variable "app_url" {
  type = string
}

variable "oidc_callback_url" {
  type = string
}

resource "aws_cognito_user_pool" "run_method" {
  name = "run-method"

  user_pool_tier = "ESSENTIALS"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  deletion_protection = "ACTIVE"

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  password_policy {
    minimum_length                   = 10
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  mfa_configuration = "OFF"

  tags = {
    application = "run-method"
    environment = "production"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_cognito_user_pool_client" "run_method_web" {
  name         = "run-method-web"
  user_pool_id = aws_cognito_user_pool.run_method.id

  generate_secret = false

  allowed_oauth_flows_user_pool_client = true

  allowed_oauth_flows = [
    "code"
  ]

  allowed_oauth_scopes = [
    "openid",
    "email",
    "profile"
  ]

  supported_identity_providers = [
    "COGNITO"
  ]

  callback_urls = [
    var.oidc_callback_url
  ]

  logout_urls = [
    var.app_url
  ]

  enable_token_revocation       = true
  prevent_user_existence_errors = "ENABLED"

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "run_method" {
  domain                = local.auth_domain
  user_pool_id          = aws_cognito_user_pool.run_method.id
  certificate_arn       = aws_acm_certificate_validation.cognito.certificate_arn
  managed_login_version = 2
}

resource "aws_cognito_managed_login_branding" "run_method" {
  user_pool_id = aws_cognito_user_pool.run_method.id
  client_id    = aws_cognito_user_pool_client.run_method_web.id

  use_cognito_provided_values = true

  depends_on = [
    aws_cognito_user_pool_domain.run_method
  ]
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.run_method.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.run_method_web.id
}

output "cognito_issuer" {
  value = "https://cognito-idp.eu-west-2.amazonaws.com/${aws_cognito_user_pool.run_method.id}"
}

output "cognito_domain" {
  value = "https://${aws_cognito_user_pool_domain.run_method.domain}"
}
