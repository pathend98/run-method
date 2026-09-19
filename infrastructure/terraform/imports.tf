import {
  to = aws_ecr_repository.run_method
  id = "run-method"
}

import {
  to = aws_cloudwatch_metric_alarm.ec2_cpu_high
  id = "run-method-ec2-cpu-utilisation-alarm"
}

import {
  to = aws_iam_role.run_method_ec2
  id = "run-method-ec2-role"
}

import {
  to = aws_iam_instance_profile.run_method_ec2
  id = "run-method-ec2-role"
}
