output "public_ip" {
  description = "Instance public IPv4 address."
  value       = aws_instance.demo.public_ip
}

output "site_url" {
  description = "HTTPS URL to give the judges (sslip.io wildcard DNS, no domain purchase needed)."
  value       = "https://${replace(aws_instance.demo.public_ip, ".", "-")}.sslip.io"
}

output "ssh_command" {
  description = "SSH into the instance as the ubuntu user."
  value       = "ssh ubuntu@${aws_instance.demo.public_ip}"
}

output "rsync_command" {
  description = "Copy the working tree to the instance (run from the repo root). See docs/deploy.md for the full excludes list."
  value       = "rsync -az --exclude-from=deploy/rsync-exclude.txt ./ ubuntu@${aws_instance.demo.public_ip}:/opt/chahed/app/"
}
