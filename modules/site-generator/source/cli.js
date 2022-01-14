#!/usr/bin/env node

import { readFile } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'

const configPath = join(process.cwd(), 'site-generator.config.js')

readFile(configPath, (error) => {
	if (error !== null) {
		console.error('Failed to read config')
    console.error(error)
	}

	exec('node ' + configPath, (error, stdout) => {
		if (error !== null) {
			console.error('Failed to run config')
      console.error(error)
		}

		console.log(stdout)
	})
})
