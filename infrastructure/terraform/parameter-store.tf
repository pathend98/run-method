resource "aws_ssm_parameter" "cloudwatch_agent_config" {
  name = "/run-method/prod/cloudwatch-agent"
  type = "String"

  value = jsonencode({
    metrics = {
      namespace = "CWAgent"

      append_dimensions = {
        InstanceId = "$${aws:InstanceId}"
      }

      metrics_collected = {
        mem = {
          measurement = [
            "mem_used_percent"
          ]

          metrics_collection_interval = 60
        }

        disk = {
          measurement = [
            "used_percent"
          ]

          resources = [
            "/"
          ]

          metrics_collection_interval = 60
        }
      }
    }
  })

  tags = {
    application = "run-method"
    environment = "production"
  }
}