resource "aws_security_group" "run_method_web" {
  name        = "run-method-web"
  description = "Run method security group."

  vpc_id = data.aws_subnet.run_method.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.run_method_web.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 80
  to_port     = 80
  ip_protocol = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.run_method_web.id

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "all_ipv4" {
  security_group_id = aws_security_group.run_method_web.id

  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = "-1"
}

resource "aws_security_group" "rds_ec2_1" {
  name        = "rds-ec2-1"
  description = "Security group attached to run-method to allow EC2 instances with specific security groups attached to connect to the database. Modification could lead to connection loss."

  vpc_id = data.aws_subnet.run_method.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "inbound_postgres" {
  security_group_id = aws_security_group.rds_ec2_1.id

  ip_protocol = "tcp"
  from_port   = 5432
  to_port     = 5432

  referenced_security_group_id = aws_security_group.ec2_rds_1.id
}

resource "aws_security_group" "ec2_rds_1" {
  name        = "ec2-rds-1"
  description = "Security group attached to instances to securely connect to run-method. Modification could lead to connection loss."

  vpc_id = data.aws_subnet.run_method.vpc_id
}

resource "aws_vpc_security_group_egress_rule" "outbound_postgres" {
  security_group_id = aws_security_group.ec2_rds_1.id
  description       = "Rule to allow connections to run-method from any instances this security group is attached to"

  ip_protocol = "tcp"
  from_port   = 5432
  to_port     = 5432

  referenced_security_group_id = aws_security_group.rds_ec2_1.id
}
