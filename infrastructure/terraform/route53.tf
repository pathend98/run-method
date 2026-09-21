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
