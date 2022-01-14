import { join } from 'path'
import fs from 'fs'

function logotype (logotype) {
	return `
		${logotype.split('!')[0]}
		${logotype.split('!')[1]}
	`.trim()
}

export default class SiteGenerator {
	constructor (options) {
		this.rootDir = options.root || process.cwd()
		this.styleDir = join(this.rootDir, options.style)  || null
		this.templateDir = join(this.rootDir, options.templates || 'templates')
		this.pagesDir = join(this.rootDir, options.pages || 'pages')
		this.postsDir = join(this.rootDir, options.posts || 'posts')
		this.buildDir = join(process.cwd(), options.build || 'build')

		this.init()
	}

	copyStyle () {
		async function copyFolderSync (from, to) {
			await fs.promises.mkdir(to, { recursive: true })

			fs.readdirSync(from).forEach(element => {
				if (fs.lstatSync(join(from, element)).isFile()) {
					fs.copyFileSync(join(from, element), join(to, element))
				} else {
					copyFolderSync(join(from, element), join(to, element))
				}
			})
		}

		copyFolderSync(this.styleDir, join(this.distDir, "/css"))
	}

	template (template) {
		return new Function(
			'data',
			'const include = (file, options = {}) => data.include(file + ".tl", Object.assign(data, options)); return `' + template + '`'
		)
	}

	markdown (markdown) {
		return markdown
			.replace(/!\[(.*?)\]\((.*?)\)/ig, '<img src="$2" alt=\"$1\ />') //images
			.replace(/\[(.*?)\]\((.*?)\)/ig, '<a href=\"$2\">$1</a>') // links
			.replace(/\*\*(.*?)\*\*/ig, '<strong>$1</strong>') // bold
			.replace(/__(.*?)__/ig, '<strong>$1</strong>') // bold
			.replace(/\*(.*?)\*/ig, '<em>$1</em>') // italics
			.replace(/_(.*?)_/ig, '<em>$1</em>') // italics
			.replace(/`(.*?)`/ig, '<code>$1</code>') // code
			.replace(/~~(.*?)~~/ig, '<del>$1</del>') // strikeThrough
			.replace(/^\s*#\s+(.*?$)/ig, '<h1>$1</h1>') // h1
			.replace(/^\s*##\s+(.*?$)/ig, '<h2>$1</h2>') // h2
			.replace(/^\s*###\s+(.*?$)/ig, '<h3>$1</h3>') // h3
			.replace(/^\s*####\s+(.*?$)/ig, '<h4>$1</h4>') // h4
			.replace(/^\s*#####\s+(.*?$)/ig, '<h5>$1</h5>') // h5
			.replace(/^\s*######\s+(.*?$)/ig, '<h6>$1</h6>') // h6
	}

	frontMatter (source) {
		source = source.trim()

		const openRE = new RegExp(`^---`)
		const closeRE = new RegExp(`---`)

		if (!(openRE.test(source) && closeRE.test(source))) {
    	return {
				content: source
			}
		}

		function parse (string) {
			let data = string.split(/\r?\n/)
			data = data.map(item => item.split(': '))

			return Object.fromEntries(data)
		}

		const x = openRE.exec(source)
		const i = x[0].length
		const y = closeRE.exec(source.substr(i))
		const j = i + y.index
		const k = j + y[0].length
		const front = source.substring(i, j)

		const head = parse(front.trim())
		const content = source.slice(k).trim()

		return {
			head,
			content
		}
	}

	parsePages () {
		const pages = fs.readdirSync(this.pagesDir)
		const templateContent = fs.readFileSync(join(this.templateDir, 'page.html'), 'utf8')
	
		for (let i = 0; i < pages.length; i++) {
			const page = pages[i]
			const pageContent = fs.readFileSync(join(this.pagesDir, page), 'utf8')

			const { head, content } = this.frontMatter(pageContent)

			let compile = this.template(templateContent)
			const outputFile = join(this.buildDir, page + '.html')

			fs.writeFileSync(outputFile, compile({
				title: head.title,
				logotype: logotype(head.logotype).replace(/(\n)\s+/g, '$1'),
				content: this.markdown(content)
			}))
		}
	}

	async init () {
		// Create build folder
		await fs.promises.mkdir(this.buildDir, { recursive: true })

		if (this.styleDir) {
			this.copyStyle()
		}

		this.parsePages()
	}
}
