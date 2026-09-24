resource "aws_route53_zone" "run_method" {
  name          = "runmethodtraining.com"
  force_destroy = false

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_route53_record" "run_method" {
  zone_id = aws_route53_zone.run_method.id
  name    = aws_route53_zone.run_method.name
  type    = "A"
  ttl     = 300

  records = [
    aws_eip.run_method.public_ip
  ]
}

resource "aws_route53_record" "run_method_www" {
  zone_id = aws_route53_zone.run_method.id
  name    = "www.runmethodtraining.com"
  type    = "CNAME"
  ttl     = 300

  records = [
    aws_route53_record.run_method.name
  ]
}

resource "aws_route53_record" "cognito_auth" {
  zone_id = aws_route53_zone.run_method.zone_id
  name    = local.auth_domain
  type    = "A"

  alias {
    name                   = aws_cognito_user_pool_domain.run_method.cloudfront_distribution
    zone_id                = aws_cognito_user_pool_domain.run_method.cloudfront_distribution_zone_id
    evaluate_target_health = false
  }
}
