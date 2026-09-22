resource "aws_cloudwatch_metric_alarm" "ec2_cpu_high" {
  alarm_name        = "run-method-ec2-cpu-utilisation-alarm"
  alarm_description = "EC2 CPU utilisation is high"

  metric_name = "CPUUtilization"
  namespace   = "AWS/EC2"

  statistic           = "Average"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  datapoints_to_alarm = 1
  period              = 300
  threshold           = 80

  treat_missing_data = "missing"

  dimensions = {
    InstanceId = aws_instance.run_method.id
  }

  alarm_actions = [
    aws_sns_topic.run_method_alerts.arn
  ]
}

resource "aws_cloudwatch_metric_alarm" "ec2_status_check_failed" {
  alarm_name = "run-method-ec2-status-check-failed-alarm"

  metric_name = "StatusCheckFailed"
  namespace   = "AWS/EC2"

  statistic           = "Maximum"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  period              = 60
  evaluation_periods  = 1
  datapoints_to_alarm = 1
  threshold           = 1

  treat_missing_data = "missing"

  dimensions = {
    InstanceId = aws_instance.run_method.id
  }

  alarm_actions = [
    aws_sns_topic.run_method_alerts.arn
  ]
}

resource "aws_cloudwatch_metric_alarm" "rds_free_storage_low" {
  alarm_name        = "run-method-rds-free-storage-low"
  alarm_description = "Run Method RDS free storage space is low"

  namespace   = "AWS/RDS"
  metric_name = "FreeStorageSpace"

  statistic           = "Minimum"
  comparison_operator = "LessThanThreshold"
  period              = 60
  evaluation_periods  = 5
  datapoints_to_alarm = 5
  # 4 GiB
  threshold = 4 * 1024 * 1024 * 1024

  treat_missing_data = "missing"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.run_method.identifier
  }
}
