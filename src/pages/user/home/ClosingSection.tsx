import {EditorialCta, EditorialImage, Reveal} from './editorial';
import {homepageImages} from './homepageImages';

export function ClosingSection() {
  return (
    <section className="bg-[#FCFAF7]">
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
          <h2 className="break-words font-display text-[26px] font-medium leading-[1.15] text-[#1E1E1E] sm:text-[32px] lg:text-[36px]">
            <span className="block">PRIVATE RELATIONSHIPS.</span>
            <span className="block">CONSIDERED EXPERIENCES.</span>
          </h2>

          <p className="mt-4 text-sm leading-[1.85] text-[#77716A]">
            Every relationship begins with a conversation.
          </p>

          <div className="mt-6">
            <EditorialCta to="/dashboard/messages">Begin a conversation</EditorialCta>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
