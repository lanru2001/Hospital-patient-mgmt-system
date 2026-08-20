variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "project" {
  type    = string
  default = "hospital-pms"
}

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "az_count" {
  type    = number
  default = 2
}

variable "container_port" {
  type    = number
  default = 8000
}

variable "ecs_task_cpu" {
  type    = number
  default = 512
}

variable "ecs_task_memory" {
  type    = number
  default = 1024
}

variable "ecs_desired_count" {
  type    = number
  default = 2
}

variable "ecs_min_count" {
  type    = number
  default = 2
}

variable "ecs_max_count" {
  type    = number
  default = 8
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.medium"
}

variable "db_allocated_storage" {
  type    = number
  default = 50
}

variable "db_name" {
  type    = string
  default = "hospital_pms"
}

variable "db_username" {
  type    = string
  default = "pms_admin"
}

variable "domain_name" {
  description = "e.g. api.hospital-pms.example.com — used for ACM cert + Route53"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  type    = string
  default = ""
}
