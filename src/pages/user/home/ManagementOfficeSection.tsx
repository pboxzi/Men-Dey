import {EditorialImage, Reveal} from './editorial';
import {homepageImages} from './homepageImages';

export function ManagementOfficeSection() {
  return (
    <section className="border-x border-b border-[#E8E1D7] bg-[#FCFAF7]">
      <div className="mx-auto grid w-full max-w-[1500px] items-stretch gap-0 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="order-2 flex min-w-0 flex-col justify-center px-6 py-12 sm:px-10 lg:order-1 lg:px-16 lg:py-24">
          <Reveal>
            <span className="block h-px w-10 bg-[#C89B3C]" aria-hidden />
            <h2 className="mt-4 break-words font-sans text-[11px] font-bold uppercase leading-[1.7] tracking-[0.28em] text-[#1E1E1E] sm:text-[12px]">
              The management office
            </h2>

            <p className="mt-4 max-w-[30rem] break-words font-display text-[19px] italic leading-[1.55] text-[#1E1E1E] lg:text-[23px]">
              Every request begins with a conversation.
            </p>

            <p className="mt-4 max-w-[30rem] break-words font-display text-[15px] leading-[1.9] text-[#77716A] lg:text-base">
              Management is the private point of contact for personal requests, experiences and
              professional enquiries.
            </p>
          </Reveal>
        </div>

        <div className="relative order-1 h-[66vw] max-h-[380px] w-full overflow-hidden sm:max-h-[440px] lg:order-2 lg:h-auto lg:max-h-none lg:min-h-[76vh]">
          <EditorialImage
            src={homepageImages.session2}
            alt="Gillian Anderson reviewing papers at her desk in a calm interior"
            position="object-[center_32%]"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#FCFAF7] to-transparent"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
