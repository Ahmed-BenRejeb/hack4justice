variable "aws_region" {
  description = "AWS region for the demo instance. eu-central-1 (Frankfurt): lowest latency to Tunisia with full instance-type availability."
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Name tag applied to every resource, and the demo stack's identifier."
  type        = string
  default     = "chahed-demo"
}

variable "instance_type" {
  description = "EC2 instance type. c6i.xlarge (4 vCPU, 8 GB, non-burstable) avoids CPU-credit throttling during OCR and embedding on a live demo."
  type        = string
  default     = "c6i.xlarge"
}

variable "root_volume_size_gb" {
  description = "Root EBS volume size in GB. The API image bundles torch and sentence-transformers; 30 GB gives headroom over the default 8 GB."
  type        = number
  default     = 30
}

variable "admin_cidr" {
  description = "CIDR allowed to reach SSH (port 22), e.g. \"203.0.113.10/32\". No default: an open SSH port is not an acceptable fallback. Get yours with `curl ifconfig.me`."
  type        = string

  validation {
    condition     = can(cidrhost(var.admin_cidr, 0))
    error_message = "admin_cidr must be a valid CIDR block, e.g. 203.0.113.10/32."
  }
}

variable "public_key_path" {
  description = "Path to the SSH public key to install on the instance, e.g. \"~/.ssh/id_ed25519.pub\". No default: never hardcode a machine-specific path in tracked config."
  type        = string
}
