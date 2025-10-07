import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function kebabCase(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  // Seed Genres with kebab-case keyName
  const genres: Array<{ name: string; keyName?: string }> = [
    { name: 'Science Fiction', keyName: 'science-fiction' },
    { name: 'Fantasy', keyName: 'fantasy' },
    { name: 'Mystery', keyName: 'mystery' },
    { name: 'Non-Fiction', keyName: 'non-fiction' },
    { name: 'Romance', keyName: 'romance' },
  ];

  const genreMapByKey = new Map<string, string>(); // keyName -> id

  for (const g of genres) {
    const keyName = g.keyName ?? kebabCase(g.name);
    const genre = await prisma.genre.upsert({
      where: { keyName },
      update: { name: g.name },
      create: { name: g.name, keyName },
    });
    genreMapByKey.set(keyName, genre.id);
  }

  // Seed Books – reference genres by kebab-case keyName
  const books: Array<{
    title: string;
    author: string;
    published: number;
    genreKey: string; // kebab-case genre keyName
  }> = [
    // Science Fiction
    {
      title: 'Dune',
      author: 'Frank Herbert',
      published: 1965,
      genreKey: 'science-fiction',
    },
    {
      title: 'Neuromancer',
      author: 'William Gibson',
      published: 1984,
      genreKey: 'science-fiction',
    },
    {
      title: 'Foundation',
      author: 'Isaac Asimov',
      published: 1951,
      genreKey: 'science-fiction',
    },

    // Fantasy
    {
      title: 'The Hobbit',
      author: 'J.R.R. Tolkien',
      published: 1937,
      genreKey: 'fantasy',
    },
    {
      title: "Harry Potter and the Sorcerer's Stone",
      author: 'J.K. Rowling',
      published: 1997,
      genreKey: 'fantasy',
    },
    {
      title: 'A Game of Thrones',
      author: 'George R.R. Martin',
      published: 1996,
      genreKey: 'fantasy',
    },

    // Mystery
    {
      title: 'The Girl with the Dragon Tattoo',
      author: 'Stieg Larsson',
      published: 2005,
      genreKey: 'mystery',
    },
    {
      title: 'Gone Girl',
      author: 'Gillian Flynn',
      published: 2012,
      genreKey: 'mystery',
    },
    {
      title: 'The Da Vinci Code',
      author: 'Dan Brown',
      published: 2003,
      genreKey: 'mystery',
    },

    // Non-Fiction
    {
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      published: 2011,
      genreKey: 'non-fiction',
    },
    {
      title: 'Educated',
      author: 'Tara Westover',
      published: 2018,
      genreKey: 'non-fiction',
    },
    {
      title: 'The Immortal Life of Henrietta Lacks',
      author: 'Rebecca Skloot',
      published: 2010,
      genreKey: 'non-fiction',
    },

    // Romance
    {
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      published: 1813,
      genreKey: 'romance',
    },
    {
      title: 'The Fault in Our Stars',
      author: 'John Green',
      published: 2012,
      genreKey: 'romance',
    },
    {
      title: 'Me Before You',
      author: 'Jojo Moyes',
      published: 2012,
      genreKey: 'romance',
    },
  ];

  for (const b of books) {
    const genreId = genreMapByKey.get(b.genreKey);
    if (!genreId) {
      console.warn(
        `Skipping book "${b.title}" because genre key "${b.genreKey}" is missing.`,
      );
      continue;
    }

    // Avoid duplicates: check by a combination of title+author+published+genreId
    const exists = await prisma.book.findFirst({
      where: {
        title: b.title,
        author: b.author,
        published: b.published,
        genreId,
      },
    });

    if (!exists) {
      await prisma.book.create({
        data: {
          title: b.title,
          author: b.author,
          published: b.published,
          genre: { connect: { id: genreId } },
        },
      });
    }
  }

  console.log('Seeding completed.');
}

main()
  .then(async () => {
    // Ensure Prisma disconnects cleanly after seeding completes
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    // Disconnect before exiting on error
    await prisma.$disconnect();
    process.exit(1);
  });
