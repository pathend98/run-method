resource "aws_security_group" "run_method_web" {
  name        = "run-method-web"
  description = "Run method security group."

  vpc_id = data.aws_subnet.default_vpc_2a.vpc_id
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

