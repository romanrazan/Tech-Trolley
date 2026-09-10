import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <h1> THis is a home page</h1>
      <Image src="/apple.webp" alt="apple logo" width={1000} height={1000} quality={100}></Image>
      <a href="/todos"> move to todos</a>
      <Link href="/todos">Move to todos with Link</Link>
      <Image src="https://www.pixoryofficial.com/_ipx/w_1512&f_webp&fit_contain/https://storage.googleapis.com/pbx-sw-digitalorca/media/d9/ac/c5/1778671329/firstsectionnew.png" width={500} height={400} alt="alt image"></Image>

    </>
  );
}
