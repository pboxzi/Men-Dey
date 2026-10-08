import {EditorialImage, Reveal} from './editorial';
import {homepageImages} from './homepageImages';

export function ClosingSection() {
  return (
    <section className="border-x border-b border-[#E8E1D7] bg-[#FCFAF7]">
      <div className="relative h-[66vw] max-h-[380px] w-full overflow-hidden sm:max-h-[440px] lg:h-[64vh]">
        <EditorialImage
          src={homepageImages.session6}
          alt="Studio portrait of Gillian Anderson"
          position="object-[center_26%]"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#FCFAF7] to-transparent"
          aria-hidden
        />
      </div>

      <div className="mx-auto w-full max-w-[1500px] px-6 pb-16 pt-10 sm:px-10 lg:px-16 lg:pb-24 lg:pt-12">
        <Reveal className="max-w-[34rem]">
          <span className="block h-px w-10 bg-[#C89B3C]" aria-hidden />
          <h2 className="mt-4 break-words font-sans text-[11px] font-bold uppercase leading-[1.7] tracking-[0.28em] text-[#1E1E1E] sm:text-[12px]">
            Private relationships. Considered experiences.
          </h2>

          <p className="mt-4 max-w-[30rem] break-words font-display text-[17px] italic leading-[1.7] text-[#1E1E1E] sm:text-[19px]">
            Every relationship begins with a conversation.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
