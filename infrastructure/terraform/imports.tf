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

import {
  to = aws_iam_role_policy_attachment.ssm_managed_instance_core
  id = "run-method-ec2-role/arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

import {
  to = aws_iam_role_policy_attachment.cloudwatch_agent_server
  id = "run-method-ec2-role/arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

import {
  to = aws_iam_role_policy.ecr_pull
  id = "run-method-ec2-role:run-method-ecr-pull"
}

import {
  to = aws_iam_role_policy.parameter_store
  id = "run-method-ec2-role:run-method-parameter-store"
}
