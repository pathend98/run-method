resource "aws_acm_certificate" "cognito" {
  provider          = aws.us_east_1

  domain_name       = local.auth_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cognito_certificate_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cognito.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = aws_route53_zone.run_method.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "cognito" {
  provider = aws.us_east_1

  certificate_arn = aws_acm_certificate.cognito.arn

  validation_record_fqdns = [
    for record in aws_route53_record.cognito_certificate_validation :
    record.fqdn
  ]
}
