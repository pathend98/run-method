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
