// Writing Part 2 task bank: a blog post, forum post or online article, 180–200 words, C1 target.
// Official rule: the prompt (30–50 words) gives the context and genre and contains a question or opinion
// to discuss. There is no named reader; the style is neutral (publicistic / popular-science).
//
// source: 'zinapoya' = our own original task.  'book' = TEST CONTENT from cefr.zip (see part1Sets.js).

export const GENRES = {
  forum: { name: 'Forum post', emoji: '💬' },
  blog: { name: 'Blog post', emoji: '📝' },
  article: { name: 'Online article', emoji: '📰' },
};

export const PART2_PROMPTS = [
  /* ------------------------------ Zinapoya originals ------------------------------ */
  {
    id: 'ai-tools-students',
    source: 'zinapoya',
    genre: 'forum',
    emoji: '🤖',
    title: 'AI tools: smarter or lazier students?',
    topic: 'Technology & devices',
    functions: ['expressing opinion', 'partly agreeing', 'speculating'],
    prompt:
      'You are taking part in an online forum for students. The question is: “Do AI tools such as chatbots make students smarter or lazier?” Post your response, giving your opinion with reasons and examples.',
  },
  {
    id: 'tourism-historic-cities',
    source: 'zinapoya',
    genre: 'article',
    emoji: '🕌',
    title: 'Tourism in historic cities',
    topic: 'Hotels & travel',
    functions: ['developing an argument', 'giving reasons', 'making suggestions'],
    prompt:
      'An online travel magazine is asking readers to write articles on this topic: “Does mass tourism help or harm historic cities like Samarkand and Bukhara?” Write an article giving your opinion, with reasons and examples.',
  },
  {
    id: 'second-foreign-language',
    source: 'zinapoya',
    genre: 'blog',
    emoji: '🗣️',
    title: 'Two foreign languages at school?',
    topic: 'Courses & learning',
    functions: ['expressing opinion', 'giving reasons', 'generalising'],
    prompt:
      'You are writing a blog post for an education website. The title is: “Should every school student learn two foreign languages?” Give your opinion and support it with reasons and examples from your own experience.',
  },
  {
    id: 'second-hand-clothes',
    source: 'zinapoya',
    genre: 'blog',
    emoji: '👕',
    title: 'Buying second-hand clothes',
    topic: 'Environment',
    functions: ['expressing opinion', 'hedging', 'emphasising'],
    prompt:
      'You are writing a blog post for a lifestyle website. The title is: “Is buying second-hand clothes the smart choice for young people today?” Write your opinion, giving reasons and examples.',
  },
  {
    id: 'influencers-role-models',
    source: 'zinapoya',
    genre: 'forum',
    emoji: '📸',
    title: 'Influencers as role models',
    topic: 'Media & reading',
    functions: ['agreeing and disagreeing', 'defending a view', 'giving reasons'],
    prompt:
      'You are taking part in an online discussion for young people. The question is: “Are social media influencers good role models for teenagers?” Post your response, giving reasons and examples.',
  },
  {
    id: 'study-abroad-or-home',
    source: 'zinapoya',
    genre: 'article',
    emoji: '🎓',
    title: 'Study abroad or at home?',
    topic: 'Work & study',
    functions: ['comparing', 'certainty and doubt', 'developing an argument'],
    prompt:
      'A student magazine has asked readers to write articles on this topic: “Is it better to go abroad for university or to study in your own country?” Write an article giving your opinion with reasons and examples.',
  },
  {
    id: 'exams-measure-ability',
    source: 'zinapoya',
    genre: 'forum',
    emoji: '📝',
    title: 'Are exams a fair test?',
    topic: 'Courses & learning',
    functions: ['partly agreeing', 'giving reasons', 'making suggestions'],
    prompt:
      'You are taking part in an online forum for language learners. The question is: “Are exams the best way to measure what students really know?” Post your response, giving reasons and examples.',
  },
  {
    id: 'cars-city-centre',
    source: 'zinapoya',
    genre: 'blog',
    emoji: '🚗',
    title: 'Cars out of the city centre?',
    topic: 'Travel & transport',
    functions: ['expressing opinion', 'speculating', 'making suggestions'],
    prompt:
      'You are writing a blog post for a city news website. The title is: “Should cars be banned from city centres?” Write your opinion, giving reasons and examples, and say what could replace them.',
  },
  {
    id: 'online-shopping-bazaars',
    source: 'zinapoya',
    genre: 'article',
    emoji: '🛒',
    title: 'Online shopping and local bazaars',
    topic: 'Food & restaurants',
    functions: ['describing change', 'developing an argument', 'certainty and doubt'],
    prompt:
      'An online newspaper is asking readers to write articles on this topic: “Will online shopping replace traditional bazaars and local shops?” Write an article giving your opinion, with reasons and examples.',
  },
  {
    id: 'traditional-crafts',
    source: 'zinapoya',
    genre: 'blog',
    emoji: '🏺',
    title: 'Keeping traditional crafts alive',
    topic: 'Culture',
    functions: ['emphasising', 'giving reasons', 'making suggestions'],
    prompt:
      'You are writing a blog post for a culture website. The title is: “Is it still important to keep traditional crafts alive in the modern world?” Give your opinion, with reasons and examples.',
  },

  /* ------------------------------ Book prompts (TEST CONTENT) ------------------------------ */
  {
    id: 'book-city-or-town',
    source: 'book',
    ref: 'Multilevel Notion, Practice 1',
    genre: 'forum',
    emoji: '🏙️',
    title: 'Big city or small town?',
    topic: 'Lifestyle',
    functions: ['comparing', 'expressing opinion'],
    prompt: 'You are participating in an online discussion for language learners. The question is: “Is it better to live in a big city or a small town?” Post your response, giving reasons and examples.',
    sample:
      'I believe it’s better to live in a small town than in a big city. Although big cities have more job opportunities, entertainment and public transport, small towns offer a more peaceful and healthy lifestyle.\n\nFirst of all, small towns are usually quieter and less crowded, which means less noise, traffic and stress. People often know each other, and there’s a stronger sense of community. You can walk to most places, which is better for your health and the environment.\n\nAlso, living in a small town is usually cheaper. Rent, food and daily expenses cost less than in big cities, so it’s easier to live comfortably, even on a lower income.\n\nI grew up in a small town, and I always felt safe there. Children can play outside, and neighbours look out for each other. It’s a great place to raise a family.\n\nOf course, big cities have more things to do, but sometimes they feel too fast and busy. In my opinion, small towns offer a better quality of life, especially for people who prefer calm and close relationships.',
  },
  {
    id: 'book-smartphones-young',
    source: 'book',
    ref: 'Multilevel Notion, Practice 2',
    genre: 'blog',
    emoji: '📱',
    title: 'Smartphones and young people',
    topic: 'Technology & devices',
    functions: ['expressing opinion', 'partly agreeing'],
    prompt: 'You are writing a blog post for a student website. The title is: “Do smartphones make life better or worse for young people?” Write your opinion with reasons and examples.',
    sample:
      'Smartphones have become a big part of our daily lives, especially for young people. In my opinion, smartphones can make life better, but only if they are used in a smart and balanced way.\n\nFirst of all, smartphones help young people stay connected with friends and family. Apps like WhatsApp, Instagram and video calls make it easy to talk with people, even if they live far away. This can be very helpful for students who move to new cities for school.\n\nSecondly, smartphones give us access to useful tools. We can learn languages, check homework answers or watch educational videos. There are also apps for time management, health and even mental wellness.\n\nHowever, there are also some negatives. Many young people spend too much time on their phones, scrolling through social media or playing games. This can lead to poor sleep, less physical activity and feeling lonely or anxious.\n\nIn conclusion, smartphones can make life better for young people if they are used responsibly. They offer many benefits, but it’s important to take breaks, be mindful and use them to improve your life — not escape from it.',
  },
  {
    id: 'book-online-vs-classroom',
    source: 'book',
    ref: 'Multilevel Notion, Practice 3',
    genre: 'article',
    emoji: '🏫',
    title: 'Online or classroom learning?',
    topic: 'Courses & learning',
    functions: ['comparing', 'expressing opinion'],
    prompt: 'The magazine has asked students to write articles about this topic: “Is learning online better than learning in a classroom?” Write an article giving your opinion and supporting it with examples.',
    sample:
      'In recent years, online learning has become more popular, especially after the COVID-19 pandemic. But is it better than learning in a classroom? In my opinion, both methods have benefits, but learning in a classroom is still more effective for most students.\n\nOne big advantage of classroom learning is face-to-face interaction. Students can ask questions directly, discuss ideas with classmates and receive help from the teacher immediately. This creates a more active and social learning environment.\n\nAlso, classrooms offer fewer distractions. At home, students may be tempted to watch videos, check their phones or even fall asleep during online lessons. In a classroom, it’s easier to stay focused and organised.\n\nOn the other hand, online learning is more flexible. You can study at your own pace, review lessons again and learn from anywhere. This is helpful for people with busy schedules or those who live far from schools.\n\nIn conclusion, while online learning is convenient and useful, classroom learning offers better communication, structure and motivation. For many students, being in a real classroom helps them learn more effectively and feel more connected.',
  },
  {
    id: 'book-teen-part-time-jobs',
    source: 'book',
    ref: 'Multilevel Notion, Practice 4',
    genre: 'forum',
    emoji: '☕',
    title: 'Part-time jobs for teenagers',
    topic: 'Work & study',
    functions: ['expressing opinion', 'partly agreeing'],
    prompt: 'You are posting in an online forum for people from different countries. The topic is: “Should teenagers have part-time jobs while studying?” Write your response, giving reasons and examples.',
    sample:
      'In my opinion, teenagers should be allowed to have part-time jobs while studying, but only if they can manage both school and work without getting too tired or stressed.\n\nHaving a part-time job teaches teenagers responsibility and important life skills. For example, they learn how to manage their time, communicate with adults and work in a team. These experiences can help them in the future, both at university and in their careers.\n\nAlso, earning their own money gives teenagers a sense of independence. Instead of always asking their parents for money, they can buy things they want or save for something important. This helps them understand the value of money and how to budget.\n\nHowever, part-time jobs should not affect schoolwork. Teenagers should not work too many hours during the school week. Education is still the most important thing at this age.\n\nFor example, my cousin works at a coffee shop at weekends, and it doesn’t affect her studies at all. In fact, she says it helps her feel more confident and organised.\n\nSo yes, part-time jobs can be a good idea — as long as teenagers find the right balance.',
  },
  {
    id: 'book-online-courses-languages',
    source: 'book',
    ref: 'Multilevel Exam Book (September), Test 3',
    genre: 'forum',
    emoji: '🌐',
    title: 'Online courses or classroom for languages?',
    topic: 'Courses & learning',
    functions: ['comparing', 'expressing opinion'],
    prompt: 'You are participating in an online discussion for language learners. The question is: “Do you think learning a foreign language is more effective through online courses or traditional classroom lessons?” Post your response, giving reasons and examples.',
    sample:
      'In my opinion, both online courses and traditional classroom lessons have their own advantages, but I believe online courses are becoming a more effective way to learn a foreign language. One of the main reasons is flexibility. Online platforms allow learners to study at their own pace and choose the time that suits their schedule, which is very convenient for people with busy lives. Also, online courses often provide a wide range of multimedia materials, such as videos, interactive exercises and language apps, that make learning more engaging and fun.\n\nOn the other hand, traditional classrooms offer direct interaction with teachers and classmates, which helps with speaking practice and immediate feedback. However, nowadays, many online courses also include live sessions with tutors and virtual speaking clubs.\n\nFor example, I have been learning English through an online course, and I can practise listening, reading and vocabulary at any time. I also join weekly speaking sessions with other learners. This method has helped me improve my skills faster than attending a class once or twice a week.\n\nOverall, I believe online learning is more effective for people who are self-disciplined and motivated.',
  },
  {
    id: 'book-alone-or-group',
    source: 'book',
    ref: 'Multilevel Exam Book (September), Test 2',
    genre: 'forum',
    emoji: '👥',
    title: 'Study alone or in a group?',
    topic: 'Courses & learning',
    functions: ['comparing', 'expressing opinion'],
    prompt: 'You are participating in an online discussion for language learners. The question is: “Is it better to study alone or with a group?” Post your response, giving reasons and examples.',
    sample:
      'In my opinion, studying with a group is more effective than studying alone, especially for language learners. There are several reasons why I believe group study is better.\n\nFirstly, studying with others helps you stay motivated. When you study alone, it is easy to lose focus or feel bored. However, in a group, you can share ideas, ask questions and encourage each other. For example, if you don’t understand a grammar point, your group members can explain it to you in a simple way.\n\nSecondly, group study allows you to practise speaking and listening skills, which are very important in language learning. You can do role plays, group discussions or just have casual conversations. This is something you cannot do when you are studying alone.\n\nOf course, some people prefer studying alone because they can concentrate better without distractions. It allows them to study at their own pace. However, I think the benefits of studying with a group, such as interaction and motivation, are greater for improving communication skills.',
    wordsNote: 'Under 180 words.',
  },
  {
    id: 'book-morning-or-night',
    source: 'book',
    ref: 'Multilevel Exam Book (September), Test 10',
    genre: 'forum',
    emoji: '🌅',
    title: 'Morning or night study?',
    topic: 'Courses & learning',
    functions: ['comparing', 'expressing preference'],
    prompt: 'You are participating in an online discussion for language learners. The question is: “Do you prefer studying in the morning or at night? Why or why not?” Post your response, giving reasons and examples.',
    sample:
      'Personally, I prefer studying in the morning because my mind feels fresh and I can concentrate better after a good night’s sleep. In the early hours, there are fewer distractions, so I can focus on difficult tasks like reading or writing essays. I usually wake up early, have breakfast and then study for a few hours.\n\nIn contrast, studying at night can be challenging for me because I often feel tired after a long day. Although some people say they concentrate better at night, I find it hard to stay motivated and focused during late hours. However, I sometimes review my notes before going to bed, which helps me remember important information.\n\nFor example, when I was preparing for my English exam, I used to study grammar and vocabulary in the morning. As a result, I was able to learn more effectively and had time for revision in the evening.\n\nIn conclusion, I believe studying in the morning is better because it allows me to use my energy and concentration more efficiently.',
    wordsNote: 'Under 180 words.',
  },
  {
    id: 'book-films-or-books',
    source: 'book',
    ref: 'Multilevel Exam Book (September), Test 9',
    genre: 'forum',
    emoji: '🎥',
    title: 'Films or books for learning a language?',
    topic: 'Media & reading',
    functions: ['comparing', 'partly agreeing'],
    prompt: 'You are participating in an online discussion for language learners. The question is: “Is it more effective to learn a language through watching movies or reading books?” Post your response, giving reasons and examples.',
    sample:
      'I believe both watching movies and reading books are effective ways to learn a language, but watching movies might be more helpful for improving listening and speaking skills. Movies expose learners to natural conversations, slang and real-life expressions that are often not found in textbooks. By listening to how native speakers pronounce words and use intonation, learners can improve their own pronunciation and comprehension.\n\nFor example, I watch English movies with subtitles, and it helps me learn new phrases and understand different accents. It also makes learning fun and relaxing, which motivates me to practise more often.\n\nOn the other hand, reading books is excellent for expanding vocabulary and understanding grammar structures. Books allow you to see how sentences are formed and give you time to think about the meaning of new words.\n\nIn my opinion, a combination of both is the best approach. Watching movies can improve listening and speaking, while reading books can develop reading and writing skills. It depends on what skill you want to improve.',
    wordsNote: 'Under 180 words.',
  },
  {
    id: 'book-homework',
    source: 'book',
    ref: 'Multilevel Exam Book (September), Test 6',
    genre: 'forum',
    emoji: '📓',
    title: 'Is homework necessary?',
    topic: 'Courses & learning',
    functions: ['expressing opinion', 'partly agreeing'],
    prompt: 'You are participating in an online discussion for language learners. The question is: “Some people think doing homework is essential for learning, while others believe it’s unnecessary. What is your opinion?” Post your response, giving reasons and examples.',
    sample:
      'I believe doing homework is very important for learning because it helps students practise and review what they have learned in class. Homework gives us the opportunity to work independently and develop good study habits. It also helps teachers see which students understand the material and which ones need more support.\n\nFor example, when I study English, doing writing or grammar exercises at home helps me remember the rules better. In class, we often don’t have enough time to practise everything, so homework gives me a chance to improve my skills.\n\nHowever, I also think that too much homework can be stressful and may not always be effective. The tasks should be meaningful and not just repetitive exercises. If homework is interesting and connected to real-life situations, students will be more motivated to do it.\n\nIn conclusion, homework is necessary for learning, but it should be given in reasonable amounts and with a clear purpose.',
    wordsNote: 'Under 180 words.',
  },
  {
    id: 'book-school-uniforms',
    source: 'book',
    ref: 'Multilevel Exam Book (September), Test 7',
    genre: 'forum',
    emoji: '👔',
    title: 'School uniforms',
    topic: 'Courses & learning',
    functions: ['expressing opinion', 'defending a view'],
    prompt: 'You are participating in an online discussion for language learners. The question is: “Do you think students should wear school uniforms or not? Why or why not?” Post your response, giving reasons and examples.',
    sample:
      'In my opinion, students should wear school uniforms because they promote equality and discipline. When everyone wears the same clothes, there is less focus on fashion or expensive brands, which reduces bullying or jealousy among students. Uniforms also create a sense of belonging and pride in the school community.\n\nFor example, at my school, wearing a uniform helps us feel like we are part of a team. It also saves time in the morning because we don’t have to decide what to wear every day.\n\nHowever, some people argue that uniforms limit students’ freedom of expression. I agree that students should have the right to show their personality, but I think there are other ways to do that, such as through hobbies or activities, rather than clothing.\n\nIn conclusion, I believe school uniforms are a good idea because they encourage equality and help students focus on learning instead of fashion.',
    wordsNote: 'Under 180 words.',
  },
];
