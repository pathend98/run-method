resource "aws_sns_topic" "run_method_alerts" {
  name = "run-method-alerts"

  tags = {
    application = "run-method"
    environment = "production"
  }
}

variable "alert_email" {
  description = "Email address which receives monitoring alerts"
  type        = string
}

resource "aws_sns_topic_subscription" "run_method_email" {
  topic_arn = aws_sns_topic.run_method_alerts.arn

  protocol = "email-json"
  endpoint = var.alert_email
}
