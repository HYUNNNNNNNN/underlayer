데이터베이스 구조 수정 후에는 npx prisma db push를 통해 갱신

model Name1 {
    name2 Name2[]
}

model Name2 {
    id
    text
}

이런 식으로 데이터베이스 안에 데이터베이스 넣기 가능