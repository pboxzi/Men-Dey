import {EditorialImage, Reveal, SessionLabel} from './editorial';
import {homepageImages} from './homepageImages';

const JOURNEY_STEPS = [
  {step: '01', title: 'INTRODUCE', copy: 'Begin with your request.'},
  {step: '02', title: 'DISCUSS', copy: 'Management communicates with you directly.'},
  {step: '03', title: 'CURATE', copy: 'The appropriate experience or arrangement is considered.'},
  {step: '04', title: 'ARRANGE', copy: 'Requirements, availability and details are confirmed.'},
];

export function JourneySection() {
  return (
    <section className="border-b border-[#E8E1D7] bg-[#FCFAF7]">
      <div className="mx-auto grid w-full max-w-[1500px] items-stretch gap-0 lg:grid-cols-[1.02fr_1fr]">
        <div className="order-2 flex min-w-0 flex-col justify-center px-6 pb-14 pt-10 sm:px-10 lg:order-1 lg:px-16 lg:py-24">
          <Reveal>
            <SessionLabel label="04 / 06" />

            <h2 className="mt-4 break-words font-display text-[26px] font-medium leading-[1.1] text-[#1E1E1E] sm:text-[32px] lg:text-[36px] xl:text-[40px]">
              <span className="block">YOUR</span>
              <span className="block">JOURNEY.</span>
            </h2>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#77716A] sm:text-[11px]">
              A simple process. A personal approach.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <ol className="mt-6 max-w-[32rem]">
              {JOURNEY_STEPS.map((item) => (
                <li key={item.step} className="border-t border-[#E8E1D7] py-5 last:border-b">
                  <div className="flex gap-5">
                    <span className="w-9 shrink-0 font-display text-[24px] font-medium leading-none text-[#A67F2C]">
                      {item.step}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1E1E1E]">
                        {item.title}
                      </p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-[#77716A]">
                        {item.copy}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <div className="order-1 relative h-[70vw] max-h-[460px] w-full overflow-hidden sm:max-h-[520px] lg:order-2 lg:h-auto lg:max-h-none lg:min-h-[78vh]">
          <EditorialImage
            src={homepageImages.session4}
            alt="An open notebook and warm lamp on a dark wooden desk"
            position="object-[center_50%]"
          />
        </div>
      </div>
    </section>
  );
}
