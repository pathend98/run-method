data "aws_instance" "run_method" {
  filter {
    name   = "tag:application"
    values = ["run-method"]
  }

  filter {
    name   = "tag:environment"
    values = ["production"]
  }

  filter {
    name   = "instance-state-name"
    values = ["running"]
  }
}

data "aws_subnet" "run_method" {
  id = data.aws_instance.run_method.subnet_id
}
