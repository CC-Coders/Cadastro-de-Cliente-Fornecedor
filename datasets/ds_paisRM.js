function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();

    dataset.addColumn("CODPAIS");
    dataset.addColumn("NOMEPAI");

    var conn = null;
    var stmt = null;
    var rs = null;

    try {
        var ic = new javax.naming.InitialContext();
        var ds = ic.lookup("/jdbc/RM");

        conn = ds.getConnection();
        stmt = conn.createStatement();

        // Retorna todos os países exceto Brasil
        var sql =
            "SELECT CODPAIS, DESCRICAO AS NOMEPAI " +
            "FROM GPAIS " +
            "WHERE UPPER(DESCRICAO) NOT LIKE 'BRASIL%' " +
            "ORDER BY DESCRICAO";

        rs = stmt.executeQuery(sql);

        while (rs.next()) {
            dataset.addRow([
                rs.getString("CODPAIS"),
                rs.getString("NOMEPAI")
            ]);
        }

    } catch (e) {
        dataset.addRow(["ERRO", e.toString()]);

    } finally {
        try {
            if (rs != null) rs.close();
            if (stmt != null) stmt.close();
            if (conn != null) conn.close();
        } catch (e) {
            dataset.addRow(["ERRO_CLOSE", e.toString()]);
        }
    }

    return dataset;
}