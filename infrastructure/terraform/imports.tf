import {
  to = aws_ecr_repository.run_method
  id = "run-method"
}

import {
  to = aws_cloudwatch_metric_alarm.ec2_cpu_high
  id = "run-method-ec2-cpu-utilisation-alarm"
}
