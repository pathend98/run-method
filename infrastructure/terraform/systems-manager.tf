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

    logs = {
      logs_collected = {
        files = {
          collect_list = [
            {
              file_path       = "/var/log/nginx/error.log"
              log_group_name  = aws_cloudwatch_log_group.nginx_error.name
              log_stream_name = "{instance_id}"
            }
          ]
        }
      }
    }
  })

  tags = {
    application = "run-method"
    environment = "production"
  }
}

resource "aws_ssm_association" "cloudwatch_agent" {
  name             = "AmazonCloudWatch-ManageAgent"
  association_name = "run-method-cloudwatch-agent"

  parameters = {
    action                        = "configure"
    mode                          = "ec2"
    optionalConfigurationSource   = "ssm"
    optionalConfigurationLocation = aws_ssm_parameter.cloudwatch_agent_config.name
    optionalRestart               = "yes"
  }

  targets {
    key = "InstanceIds"

    values = [
      aws_instance.run_method.id
    ]
  }

  lifecycle {
    replace_triggered_by = [
      aws_ssm_parameter.cloudwatch_agent_config
    ]
  }
}
