import { Link } from 'react-router-dom'

// Renders **bold** and [link text](/path or https://…) inside a translated string.
const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
const LINK = /^\[([^\]]+)\]\(([^)]+)\)$/

export default function RichText({ text }) {
  return text.split(TOKEN).filter(Boolean).map((part, index) => {
    if (part.startsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    const link = part.match(LINK)
    if (!link) return part
    const [, label, target] = link
    return target.startsWith('/')
      ? <Link key={index} to={target}>{label}</Link>
      : <a key={index} href={target} target="_blank" rel="noopener noreferrer">{label}</a>
  })
}
