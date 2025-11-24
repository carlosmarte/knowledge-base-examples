# Prevent idle sleep on macOS when running any make recipes
ifeq ($(shell uname -s),Darwin)
SHELL := caffeinate -i bash
endif

.PHONY: default keep-awake script demo timed cmd

# Default target
default: demo

# Run a demo script with caffeinate (prevents idle sleep)
demo:
	echo "Running long demo..."
	./your_long_task.sh

# Run a custom command with caffeinate prefix
keep-awake:
	@echo "Uptime: prevent sleep until this timestamp"
	@caffeinate -u -t 3600 &  # keeps system awake for 1 hour
	@wait

# Run a script, blocking sleep until it finishes
script:
	@echo "Executing mywork.sh under caffeinate"
	caffeinate -disu ./mywork.sh

# Run any arbitrary command via MAKECMDGOALS
# Example: make cmd COMMAND="your-command --opts"
cmd:
ifndef COMMAND
	$(error COMMAND is not set. Usage: make cmd COMMAND="your-command")
endif
	caffeinate -i $(COMMAND)

# Example: timed caffeinate for specific duration
timed:
	@echo "Keeping awake for 10 minutes..."
	caffeinate -t 600
