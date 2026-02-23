
terraform {
  required_version = ">= 1.0"
  backend "s3" {
    bucket = "boardroom-club-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "ap-northeast-2"
  }
}

provider "aws" {
  region = "ap-northeast-2"  # Seoul Region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "boardroom-club-vpc"
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  map_public_ip_on_launch = true

  tags = {
    Name = "boardroom-club-public-${count.index + 1}"
  }
}

# Private Subnet (for databases)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"

  tags = {
    Name = "boardroom-club-private-${count.index + 1}"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier           = "boardroom-club-db"
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.t3.medium"
  allocated_storage    = 100
  storage_type         = "gp3"
  db_name              = "boardroomclub"
  username             = "admin"
  password             = "var.db_password" # Ensure to use var in real code
  skip_final_snapshot  = true
  multi_az             = true
  publicly_accessible  = false

  tags = {
    Name = "boardroom-club-postgres"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "boardroom-club-redis"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  tags = {
    Name = "boardroom-club-redis"
  }
}

# ECS Cluster (for containerized services)
resource "aws_ecs_cluster" "main" {
  name = "boardroom-club-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "boardroom-club-ecs"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "boardroom-club-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = aws_subnet.public[*].id

  tags = {
    Name = "boardroom-club-alb"
  }
}
