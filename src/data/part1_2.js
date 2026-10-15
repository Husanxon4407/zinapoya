// Part 1.2 — compare two pictures (Q4) and answer two related questions (Q5, Q6).
// Questions from Part1.2.docx; pictures cropped from the exam screenshots in the same file.
const raw = [
  [1, 'Plane vs train', 'Why do people like to travel by plane?', 'What are the advantages of trains?'],
  [2, 'Markets', 'Why do people get excited about sales and discounts?', 'Do you prefer indoor or outdoor markets?'],
  [3, 'Indoor vs outdoor sport', 'What is your favorite outdoor activity?', 'Which is more important: outdoor or indoor sports?'],
  [4, 'Parks and places', 'What kind of park do you like to go to?', 'Why do people like to go to different places?'],
  [5, 'Selfies vs cameras', 'Do you prefer taking selfies or taking pictures with a camera?', 'Why do people prefer to take pictures with their phones?'],
  [6, 'Holidays vs museums', 'Are traditional holidays better than visiting museums?', 'Why do some people think that museums are boring?'],
  [7, 'Office vs home', 'What are the advantages of working from home?', 'Why do some people prefer to work in an office?'],
  [8, 'Bicycles vs cars', 'What is the impact of bicycles and cars on the environment?', 'Why do some people prefer to have their own car?'],
  [9, 'News vs books', 'In which ways can people get more information?', 'Why do some people prefer reading books to watching the news?'],
  [10, 'Concerts vs headphones', 'Why do some people prefer going to concerts?', 'Which is better for you: going to concerts or listening to music on headphones?'],
  [11, 'Car vs bus', 'Do you prefer travelling by taxi or by bus?', 'Why do some people think cars are better than public transport?'],
  [12, 'Online vs classroom', 'What are the main advantages of online education?', 'Why do some people prefer to study in face-to-face classes?'],
  [13, 'Healthy vs junk food', 'What kind of food do you eat?', 'Why do some people prefer junk food to healthy food?'],
  [14, 'Eating together vs alone', 'Do you prefer eating alone or with others?', 'What kind of food do people eat in your country?'],
  [15, 'E-books vs paper books', 'What are the advantages of reading e-books?', 'Why do some people prefer to read paper books?'],
  [16, 'Indoor vs outdoor play', 'What are the advantages of indoor activities?', 'Why do some children like outdoor activities?'],
  [17, 'Online vs supermarket', 'What are the advantages of shopping in supermarkets?', 'Why do some people prefer online shopping?'],
  [18, 'Supermarket vs local farmers', 'What is the advantage of buying products from local farmers rather than the supermarket?', 'Why do some people prefer to shop in supermarkets?'],
  [19, 'Train vs plane', 'What are the benefits of travelling by train?', 'Why do some people prefer to travel by plane?'],
  [20, 'Family trips', 'What are the advantages of family travelling?', 'Which types of trip would you prefer?'],
  [21, 'Shopping with friends', 'What are the advantages of doing shopping with friends?', 'Why do some people prefer to shop alone?'],
  [22, 'Eating alone vs with friends', 'What are the benefits of eating alone?', 'What are the benefits of eating with friends?'],
  [23, 'Phones vs playing outside', 'What are the disadvantages of playing on the phone too much?', 'What are the advantages of playing outside?'],
  [24, 'Making friends', 'How do people in your country usually make friends?', 'What do you think of making friends on the internet?'],
  [25, 'City vs countryside', 'What are the advantages of living in the countryside?', 'Why do most people prefer to live in cities?'],
  [27, 'Bike vs car', 'Which transport do you think is better for short distances?', 'How do transportation choices impact the environment?'],
];

export const PART1_2 = raw.map(([n, title, q5, q6], i) => ({
  id: `p12-${String(i + 1).padStart(2, '0')}`,
  title,
  image: `/images/part1_2/set${String(n).padStart(2, '0')}.jpg`,
  q4: 'What do you see in these pictures?',
  q5,
  q6,
}));
