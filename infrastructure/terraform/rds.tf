resource "aws_security_group" "rds_ec2_1" {
  name        = "rds-ec2-1"
  description = "Security group attached to run-method to allow EC2 instances with specific security groups attached to connect to the database. Modification could lead to connection loss."

  vpc_id = data.aws_subnet.default_vpc_2a.vpc_id
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

  vpc_id = data.aws_subnet.default_vpc_2a.vpc_id
}

resource "aws_vpc_security_group_egress_rule" "outbound_postgres" {
  security_group_id = aws_security_group.ec2_rds_1.id
  description       = "Rule to allow connections to run-method from any instances this security group is attached to"

  ip_protocol = "tcp"
  from_port   = 5432
  to_port     = 5432

  referenced_security_group_id = aws_security_group.rds_ec2_1.id
}

resource "aws_db_subnet_group" "run_method" {
  name        = "default-vpc-003d44dc9f8bea6d7"
  description = "Subnet group for run-method RDS"

  subnet_ids = [
    data.aws_subnet.default_vpc_2a.id,
    data.aws_subnet.default_vpc_2b.id,
    data.aws_subnet.default_vpc_2c.id,
    data.aws_subnet.default_vpc_2d.id
  ]
}

resource "aws_db_instance" "run_method" {
  identifier = "run-method"

  engine         = "postgres"
  engine_version = "18.6"
  instance_class = "db.t4g.micro"

  allocated_storage     = 20
  max_allocated_storage = 50
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "run_method"
  username = "postgres"
  port     = 5432

  db_subnet_group_name = aws_db_subnet_group.run_method.name

  vpc_security_group_ids = [
    aws_security_group.rds_ec2_1.id,
  ]

  apply_immediately = false

  copy_tags_to_snapshot = true
  skip_final_snapshot   = true

  publicly_accessible = false
  multi_az            = false

  backup_retention_period = 0

  deletion_protection = true

  monitoring_interval = 0

  performance_insights_enabled = true
  database_insights_mode       = "standard"

  lifecycle {
    prevent_destroy = true
  }
}
