import Section from "./components/Section";
import Markdown from 'react-markdown';


export default function Home() {


  return (
    <>
      <Section className="">
      </Section>
      <Section className="my-10">
        <article className="prose lg:prose-lg max-w-3xl">
          <Markdown>
          </Markdown>
        </article>
      </Section>


    </>
  );
}
