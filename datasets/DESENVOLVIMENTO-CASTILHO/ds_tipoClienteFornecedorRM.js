function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();

    dataset.addColumn("CODTCF");
    dataset.addColumn("DESCRICAO");

    var conn = null;
    var stmt = null;
    var rs = null;

    try {

        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("/jdbc/RM");

        conn = ds.getConnection();
        stmt = conn.createStatement();

        var sql =
            "SELECT CODTCF, DESCRICAO " +
            "FROM FTCF " +
            "WHERE CODCOLIGADA = 0 " +
            "ORDER BY DESCRICAO";

        rs = stmt.executeQuery(sql);

        while (rs.next()) {

            dataset.addRow([
                rs.getString("CODTCF"),
                rs.getString("DESCRICAO")
            ]);
        }

    } catch (e) {

        dataset.addRow([
            "ERRO",
            e.toString()
        ]);

    } finally {

        if (rs) rs.close();
        if (stmt) stmt.close();
        if (conn) conn.close();
    }

    return dataset;
}