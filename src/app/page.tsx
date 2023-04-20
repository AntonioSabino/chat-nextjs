export default function Home() {
  return (
    <div className="flex gap-5">
      <aside className="flex flex-col">
        Barra lateral
        <button type="button">New chat</button>
        <ul>
          <li>Chat 1</li>
          <li>Chat 2</li>
          <li>Chat 3</li>
        </ul>
      </aside>
      <div>
        Centro
        <ul>
          <li>mensagens</li>
        </ul>
        <form>
          <textarea placeholder="Digire sua pergunta"></textarea>
          <button type="submit">Enviar</button>
        </form>
      </div>
    </div>
  )
}
