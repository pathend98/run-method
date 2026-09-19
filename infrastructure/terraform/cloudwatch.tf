resource "aws_cloudwatch_metric_alarm" "ec2_cpu_high" {
  alarm_name          = "run-method-ec2-cpu-utilisation-alarm"
  alarm_description   = "EC2 CPU utilisation is high"
  comparison_operator = "GreaterThanThreshold"

  metric_name = "CPUUtilization"
  namespace   = "AWS/EC2"
  statistic   = "Average"


  evaluation_periods  = 1
  datapoints_to_alarm = 1
  period              = 300
  threshold           = 80

  treat_missing_data = "missing"

  dimensions = {
    InstanceId = aws_instance.run_method.id
  }
}
