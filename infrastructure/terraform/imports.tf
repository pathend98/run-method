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

import {
  to = aws_security_group.run_method_web
  id = "sg-0715aa4d24bbbafe9"
}

import {
  to = aws_vpc_security_group_ingress_rule.http
  id = "sgr-04d2ea3fd7acb6212"
}

import {
  to = aws_vpc_security_group_ingress_rule.https
  id = "sgr-0a22f6564216de23b"
}

import {
  to = aws_vpc_security_group_egress_rule.all_ipv4
  id = "sgr-088ef648ae948f05a"
}

import {
  to = aws_instance.run_method
  id = "i-024e478d1d60e6f59"
}

import {
  to = aws_security_group.ec2_rds_1
  id = "sg-02b8bbb2e052afa7b"
}

import {
  to = aws_vpc_security_group_egress_rule.outbound_postgres
  id = "sgr-0bc12afc39e5eafe9"
}

import {
  to = aws_security_group.rds_ec2_1
  id = "sg-0922d67de591b905c"
}

import {
  to = aws_vpc_security_group_ingress_rule.inbound_postgres
  id = "sgr-0e0f299f8b04151c1"
}
