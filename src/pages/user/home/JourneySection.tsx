import {EditorialImage, Reveal} from './editorial';
import {homepageImages} from './homepageImages';

const JOURNEY_STEPS = [
  {title: 'INTRODUCE', copy: 'Begin with your request.'},
  {title: 'DISCUSS', copy: 'Management communicates with you directly.'},
  {title: 'CURATE', copy: 'The appropriate experience or arrangement is considered.'},
  {title: 'ARRANGE', copy: 'Requirements, availability and details are confirmed.'},
];

export function JourneySection() {
  return (
    <section className="border-x border-b border-[#E8E1D7] bg-[#FCFAF7]">
      <div className="mx-auto grid w-full max-w-[1500px] items-stretch gap-0 lg:grid-cols-[1.02fr_1fr]">
        <div className="order-2 flex min-w-0 flex-col justify-center px-6 py-12 sm:px-10 lg:order-1 lg:px-16 lg:py-24">
          <Reveal>
            <span className="block h-px w-10 bg-[#C89B3C]" aria-hidden />
            <h2 className="mt-4 break-words font-sans text-[11px] font-bold uppercase leading-[1.7] tracking-[0.28em] text-[#1E1E1E] sm:text-[12px]">
              Your journey
            </h2>

            <p className="mt-4 font-display text-[15px] italic leading-snug text-[#77716A] sm:text-base">
              A simple process. A personal approach.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <ol className="mt-6 max-w-[32rem]">
              {JOURNEY_STEPS.map((item) => (
                <li key={item.title} className="border-t border-[#E8E1D7] py-4 last:border-b">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1E1E1E]">
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#77716A]">{item.copy}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <div className="relative order-1 h-[66vw] max-h-[380px] w-full overflow-hidden sm:max-h-[440px] lg:order-2 lg:h-auto lg:max-h-none lg:min-h-[78vh]">
          <EditorialImage
            src={homepageImages.session4}
            alt="An open notebook and warm lamp on a dark wooden desk"
            position="object-[center_50%]"
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
